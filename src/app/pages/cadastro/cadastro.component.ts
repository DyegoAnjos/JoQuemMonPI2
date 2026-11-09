import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

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
  private usuarioService = inject(UsuarioService);

  private senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  carregando = signal<boolean>(false);
  erroCadastro = signal<string>('');

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
    if (this.formularioCadastro.invalid) {
      this.formularioCadastro.markAllAsTouched();
      return;
    }

    const { nome, email, senha } = this.formularioCadastro.value;
    if (!nome || !email || !senha) return;

    this.carregando.set(true);
    this.erroCadastro.set('');

    this.usuarioService.cadastrar(nome, email, senha).subscribe({
      next: () => {
        this.carregando.set(false);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erroCadastro.set(err.error?.erro || 'Erro ao cadastrar treinador. Tente novamente.');
      },
    });
  }
}