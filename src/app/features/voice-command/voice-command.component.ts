import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
@Component({
  selector: 'app-voice-command',
  templateUrl: './voice-command.component.html',
  styleUrls: ['./voice-command.component.scss'],
})
export class VoiceCommandComponent {
  command = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(160)],
  });
  suggestions = [
    'coloca Breaking Bad',
    'abre o YouTube',
    'volta',
    'vai para a TV',
  ];
  state = '';
  intent = '';
  resolve() {
    this.state = 'Interpretando';
    const value = this.command.value;
    setTimeout(() => {
      this.state = 'Executando';
      this.intent = value.replace(/^(coloca|procura|quero assistir)\s+/i, '');
    }, 700);
    setTimeout(() => (this.state = 'Concluído'), 1500);
  }
}
