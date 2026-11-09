import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// Validador customizado para checar se senha e confirmarSenha são idênticas
function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const senha = control.get('senha')?.value;
  const confirmarSenha = control.get('confirmarSenha')?.value;

  if (!senha || !confirmarSenha) return null;

  return senha === confirmarSenha ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './cadastro.component.scss',
  templateUrl: './cadastro.component.html',
})
export class CadastroComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  private senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  formularioCadastro = this.fb.group(
    {
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.pattern(this.senhaRegex)]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: senhasIguaisValidator }
  );

  cadastrar() {
    if (this.formularioCadastro.valid) {
      // Remove confirmarSenha antes de enviar/salvar os dados
      const { confirmarSenha, ...dadosTreinador } = this.formularioCadastro.value;
      console.log('Treinador cadastrado:', dadosTreinador);

      this.router.navigate(['/home']);
    } else {
      this.formularioCadastro.markAllAsTouched();
    }
  }
}