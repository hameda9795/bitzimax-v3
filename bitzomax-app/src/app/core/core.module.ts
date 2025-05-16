import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { SubscriptionService } from './services/subscription.service';

@NgModule({
  declarations: [],  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    HeaderComponent,
    FooterComponent
  ],
  exports: [
    HeaderComponent,
    FooterComponent
  ],
  providers: [
    SubscriptionService
  ]
})
export class CoreModule { }
