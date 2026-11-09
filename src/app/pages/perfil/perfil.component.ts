import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface DadosPerfil {
  nome: string;
  foto: string;
  xp: number;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent {
  private fb = inject(FormBuilder);

  perfil = signal<DadosPerfil>({
    nome: 'Treinador Ash',
    foto: 'images/perfil/treinador_default.jpg',
    xp: 340,
  });

  editando = signal<boolean>(false);
  mensagemSucesso = signal<string>('');

  avataresDisponiveis: string[] = [
    'images/perfil/treinador_default.png',
    'images/perfil/rival_default.png',
    'images/pokemon/pikachu.png',
    'images/pokemon/charizard.png',
    'images/pokemon/chandelure.png',
  ];

  nivelAtual = computed(() => Math.floor(this.perfil().xp / 100) + 1);
  xpProgressoNivel = computed(() => this.perfil().xp % 100);

  formPerfil = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
    foto: ['', [Validators.required]],
  });

  iniciarEdicao() {
    const dadosAtuais = this.perfil();
    this.formPerfil.setValue({
      nome: dadosAtuais.nome,
      foto: dadosAtuais.foto,
    });
    this.mensagemSucesso.set('');
    this.editando.set(true);
  }

  cancelarEdicao() {
    this.editando.set(false);
    this.formPerfil.reset();
  }

  selecionarAvatarPreset(caminho: string) {
    this.formPerfil.patchValue({ foto: caminho });
  }

  aoSelecionarArquivoFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const arquivo = input.files[0];
    const leitor = new FileReader();

    leitor.onload = () => {
      if (typeof leitor.result === 'string') {
        this.formPerfil.patchValue({ foto: leitor.result });
      }
    };

    leitor.readAsDataURL(arquivo);
  }

  salvarPerfil() {
    if (this.formPerfil.invalid) {
      this.formPerfil.markAllAsTouched();
      return;
    }

    const valores = this.formPerfil.getRawValue();
    this.perfil.update((atual) => ({
      ...atual,
      nome: valores.nome.trim(),
      foto: valores.foto,
    }));

    this.editando.set(false);
    this.mensagemSucesso.set('Perfil atualizado com sucesso!');

    setTimeout(() => {
      this.mensagemSucesso.set('');
    }, 3000);
  }
}