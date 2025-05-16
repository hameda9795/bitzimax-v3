import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Genre } from '../../shared/models/genre.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GenreService {
  private apiUrl = `${environment.apiUrl}/genres`;
  private genresSubject = new BehaviorSubject<Genre[]>([]);
  public genres$ = this.genresSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadAllGenres();
  }

  loadAllGenres(): void {
    this.http.get<Genre[]>(this.apiUrl)
      .subscribe({
        next: (genres) => {
          this.genresSubject.next(genres);
        },
        error: (error) => {
          console.error('Error loading genres:', error);
        }
      });
  }

  getAllGenres(): Observable<Genre[]> {
    return this.http.get<Genre[]>(this.apiUrl);
  }

  getGenreById(id: number): Observable<Genre> {
    return this.http.get<Genre>(`${this.apiUrl}/${id}`);
  }

  createGenre(genre: Genre): Observable<Genre> {
    return this.http.post<Genre>(this.apiUrl, genre)
      .pipe(
        tap((newGenre) => {
          const currentGenres = this.genresSubject.value;
          this.genresSubject.next([...currentGenres, newGenre]);
        })
      );
  }

  updateGenre(id: number, genre: Genre): Observable<Genre> {
    return this.http.put<Genre>(`${this.apiUrl}/${id}`, genre)
      .pipe(
        tap((updatedGenre) => {
          const currentGenres = this.genresSubject.value;
          const index = currentGenres.findIndex(g => g.id === updatedGenre.id);
          if (index !== -1) {
            const updatedGenres = [...currentGenres];
            updatedGenres[index] = updatedGenre;
            this.genresSubject.next(updatedGenres);
          }
        })
      );
  }

  deleteGenre(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          const currentGenres = this.genresSubject.value;
          this.genresSubject.next(currentGenres.filter(genre => genre.id !== id));
        })
      );
  }

  checkNameExists(name: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/${name}`);
  }
} 