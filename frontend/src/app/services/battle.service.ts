import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Battle } from '../models/battle.model';

@Injectable({ providedIn: 'root' })
export class BattleService {
  private readonly apiUrl = '/api/battles';

  constructor(private http: HttpClient) {}

  getBattles(): Observable<Battle[]> {
    return this.http.get<Battle[]>(this.apiUrl);
  }

  getBattle(id: number): Observable<Battle> {
    return this.http.get<Battle>(`${this.apiUrl}/${id}`);
  }
}
