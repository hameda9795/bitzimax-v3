import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Genre } from '../../../shared/models/genre.model';
import { GenreService } from '../../../core/services/genre.service';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-genre-management',
  templateUrl: './genre-management.component.html',
  styleUrls: ['./genre-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatDialogModule
  ]
})
export class GenreManagementComponent implements OnInit {
  genres: Genre[] = [];
  displayedColumns: string[] = ['id', 'name', 'description', 'actions'];
  genreForm: FormGroup;
  isEditing = false;
  currentGenreId: number | null = null;

  constructor(
    private genreService: GenreService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.genreForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadGenres();
    
    // Subscribe to changes from the service
    this.genreService.genres$.subscribe(genres => {
      this.genres = genres;
    });
  }

  loadGenres(): void {
    this.genreService.getAllGenres().subscribe({
      next: (genres) => {
        this.genres = genres;
      },
      error: (error) => {
        console.error('Error loading genres:', error);
        this.showSnackBar('Failed to load genres');
      }
    });
  }

  onSubmit(): void {
    if (this.genreForm.invalid) {
      return;
    }

    const genre: Genre = this.genreForm.value;

    if (this.isEditing && this.currentGenreId) {
      this.updateGenre(this.currentGenreId, genre);
    } else {
      this.createGenre(genre);
    }
  }

  createGenre(genre: Genre): void {
    this.genreService.createGenre(genre).subscribe({
      next: (newGenre) => {
        this.showSnackBar(`Genre "${newGenre.name}" created successfully`);
        this.resetForm();
      },
      error: (error) => {
        console.error('Error creating genre:', error);
        this.showSnackBar('Failed to create genre');
      }
    });
  }

  updateGenre(id: number, genre: Genre): void {
    this.genreService.updateGenre(id, genre).subscribe({
      next: (updatedGenre) => {
        this.showSnackBar(`Genre "${updatedGenre.name}" updated successfully`);
        this.resetForm();
      },
      error: (error) => {
        console.error('Error updating genre:', error);
        this.showSnackBar('Failed to update genre');
      }
    });
  }

  editGenre(genre: Genre): void {
    this.isEditing = true;
    this.currentGenreId = genre.id!;
    this.genreForm.patchValue({
      name: genre.name,
      description: genre.description
    });
  }

  deleteGenre(genre: Genre): void {
    const dialogData: ConfirmDialogData = {
      title: 'Delete Genre',
      message: `Are you sure you want to delete the genre "${genre.name}"?`,
      confirmText: 'DELETE',
      cancelText: 'CANCEL'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      panelClass: 'cyberpunk-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.genreService.deleteGenre(genre.id!).subscribe({
          next: () => {
            this.showSnackBar(`Genre "${genre.name}" deleted successfully`);
          },
          error: (error) => {
            console.error('Error deleting genre:', error);
            this.showSnackBar('Failed to delete genre');
          }
        });
      }
    });
  }

  resetForm(): void {
    this.genreForm.reset();
    this.isEditing = false;
    this.currentGenreId = null;
  }

  showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
} 