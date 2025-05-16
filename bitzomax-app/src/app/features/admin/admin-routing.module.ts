import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { VideoManagementComponent } from './video-management/video-management.component';
import { VideoUploadComponent } from './video-upload/video-upload.component';
import { VideoCleanupComponent } from './components/video-cleanup/video-cleanup.component';

const routes: Routes = [
  { 
    path: '', 
    component: DashboardComponent 
  },
  { 
    path: 'users', 
    component: UserManagementComponent 
  },
  { 
    path: 'videos', 
    component: VideoManagementComponent 
  },
  { 
    path: 'upload', 
    component: VideoUploadComponent 
  },
  { 
    path: 'cleanup', 
    component: VideoCleanupComponent 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
