import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './login.component.scss',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private usuarioService = inject(UsuarioService);

  private senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  carregando = signal<boolean>(false);
  erroLogin = signal<string>('');

  formullarioLogin = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.pattern(this.senhaRegex)]],
  });

  logar() {
    if (this.formullarioLogin.invalid) {
      this.formullarioLogin.markAllAsTouched();
      return;
    }

    const { email, senha } = this.formullarioLogin.value;
    if (!email || !senha) return;

    this.carregando.set(true);
    this.erroLogin.set('');

    this.usuarioService.login(email, senha).subscribe({
      next: () => {
        this.carregando.set(false);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erroLogin.set(err.error?.erro || 'E-mail ou senha inválidos.');
      },
    });
  }
}