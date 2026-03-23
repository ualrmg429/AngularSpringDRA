import { Routes } from '@angular/router';
import { BattleListComponent } from './components/battle-list/battle-list.component';

export const routes: Routes = [
  { path: '', component: BattleListComponent },
  { path: '**', redirectTo: '' }
];
