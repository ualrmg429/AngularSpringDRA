import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BattleService } from '../../services/battle.service';
import { Battle } from '../../models/battle.model';

@Component({
  selector: 'app-battle-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './battle-list.component.html',
  styleUrl: './battle-list.component.css'
})
export class BattleListComponent implements OnInit {
  battles = signal<Battle[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  expandedId = signal<number | null>(null);

  constructor(private battleService: BattleService) {}

  ngOnInit() {
    this.battleService.getBattles().subscribe({
      next: (data) => {
        this.battles.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las batallas. ¿Está el backend activo?');
        this.loading.set(false);
      }
    });
  }

  toggleExpand(id: number) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  isExpanded(id: number): boolean {
    return this.expandedId() === id;
  }
}
