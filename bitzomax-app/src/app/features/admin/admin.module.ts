import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Chart.js
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

// File Upload
import { NgxDropzoneModule } from 'ngx-dropzone';

// Components
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { VideoManagementComponent } from './video-management/video-management.component';
import { VideoUploadComponent } from './video-upload/video-upload.component';
import { VideoCleanupComponent } from './components/video-cleanup/video-cleanup.component';

const materialModules = [
  MatCardModule,
  MatButtonModule,
  MatTableModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatChipsModule,
  MatIconModule,
  MatTabsModule,
  MatProgressBarModule,
  MatSlideToggleModule
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ...materialModules,
    BaseChartDirective,
    NgxDropzoneModule,
    // Import standalone components instead of declaring them
    DashboardComponent,
    UserManagementComponent,
    VideoManagementComponent,
    VideoUploadComponent,
    VideoCleanupComponent
  ],
  providers: [
    provideCharts(withDefaultRegisterables())
  ]
})
export class AdminModule { }
