import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { VideoComponent } from './features/video/video.component';
import { ProfileComponent } from './features/profile/profile.component';
import { withPreloading } from '@angular/router';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'videos', component: HomeComponent },
  { path: 'video/:id', component: VideoComponent, data: { renderMode: 'client' } },
  { path: 'profile', component: ProfileComponent },
  { 
    path: 'admin', 
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    // Note: Add proper authentication guard here in production
    data: { renderMode: 'client' }
  },
  { path: '**', redirectTo: '' } // Handle 404s by redirecting to home
];
