package com.labswill.controlebtv;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import dadb.AdbShellResponse;
import dadb.AdbKeyPair;
import dadb.Dadb;
import java.io.File;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "NativeAdb")
public class NativeAdbPlugin extends Plugin {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void load() {
        System.setProperty("user.home", getContext().getFilesDir().getAbsolutePath());
    }

    @Override
    protected void handleOnDestroy() {
        executor.shutdownNow();
    }

    @PluginMethod
    public void status(PluginCall call) {
        execute(call, dadb -> {
            AdbShellResponse result = dadb.shell("echo connected");
            JSObject response = new JSObject();
            response.put("connection", result.getExitCode() == 0 ? "device" : "offline");
            response.put("details", result.getAllOutput().trim());
            call.resolve(response);
        });
    }

    @PluginMethod
    public void shell(PluginCall call) {
        String command = required(call, "command");
        if (command == null) return;
        execute(call, dadb -> {
            AdbShellResponse result = dadb.shell(command);
            JSObject response = new JSObject();
            response.put("output", result.getAllOutput());
            response.put("exitCode", result.getExitCode());
            call.resolve(response);
        });
    }

    @PluginMethod
    public void key(PluginCall call) {
        String key = required(call, "key");
        if (key == null) return;
        execute(call, dadb -> {
            ensureSuccess(dadb.shell("input keyevent " + safeToken(key)));
            call.resolve();
        });
    }

    @PluginMethod
    public void text(PluginCall call) {
        String text = required(call, "text");
        if (text == null) return;
        execute(call, dadb -> {
            String normalized = java.text.Normalizer
                .normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim();
            String[] words = normalized.split("\\s+");
            for (int index = 0; index < words.length; index++) {
                String word = words[index].replaceAll("[^a-zA-Z0-9._@-]", "");
                if (!word.isEmpty()) ensureSuccess(dadb.shell("input text " + word));
                if (index < words.length - 1) ensureSuccess(dadb.shell("input keyevent 62"));
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void install(PluginCall call) {
        String path = required(call, "path");
        if (path == null) return;
        execute(call, dadb -> {
            Object result = dadb.install(new File(path), "-r");
            resolveOperation(call, result);
        });
    }

    @PluginMethod
    public void uninstall(PluginCall call) {
        String packageName = required(call, "packageName");
        if (packageName == null) return;
        execute(call, dadb -> resolveOperation(call, dadb.uninstall(packageName)));
    }

    private void resolveOperation(PluginCall call, Object result) {
        String resultName = result.getClass().getSimpleName();
        JSObject response = new JSObject();
        response.put("success", resultName.equals("Success"));
        response.put("message", result.toString());
        call.resolve(response);
    }

    private void ensureSuccess(AdbShellResponse response) throws Exception {
        if (response.getExitCode() != 0) {
            throw new Exception(response.getAllOutput().trim());
        }
    }

    private String safeToken(String value) {
        if (!value.matches("[A-Z0-9_]+")) throw new IllegalArgumentException("Comando inválido");
        return value;
    }

    private String required(PluginCall call, String name) {
        String value = call.getString(name);
        if (value == null || value.trim().isEmpty()) {
            call.reject("Campo obrigatório: " + name);
            return null;
        }
        return value;
    }

    private void execute(PluginCall call, AdbAction action) {
        String host = required(call, "host");
        Integer port = call.getInt("port", 5555);
        if (host == null) return;
        executor.execute(() -> {
            try (Dadb dadb = Dadb.create(
                host,
                port,
                AdbKeyPair.readDefault(),
                8000,
                15000,
                false
            )) {
                action.run(dadb);
            } catch (Throwable error) {
                String name = error.getClass().getSimpleName();
                Exception exception = error instanceof Exception
                    ? (Exception) error
                    : new Exception(error);
                if (name.contains("Auth")) {
                    call.reject("Confirme a autorização ADB na TV", exception);
                } else {
                    call.reject(
                        error.getMessage() == null ? name : error.getMessage(),
                        exception
                    );
                }
            }
        });
    }

    private interface AdbAction {
        void run(Dadb dadb) throws Exception;
    }
}
