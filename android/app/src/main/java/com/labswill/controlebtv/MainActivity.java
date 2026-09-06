package com.labswill.controlebtv;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeAdbPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
