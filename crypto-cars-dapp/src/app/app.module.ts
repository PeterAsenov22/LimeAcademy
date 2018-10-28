import { AppRoutingModule } from './app.routing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CarsModule } from './components/cars/cars.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GuardsModule } from './core/guards/guards.module';
import { NgModule } from '@angular/core';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ServicesModule } from './core/services/services.module';
import { ToastrModule } from 'ngx-toastr';
import { WalletModule } from './components/wallet/wallet.module';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NavigationComponent } from './components/shared/navigation/navigation.component';
import { NotFoundComponent } from './components/shared/not-found/not-found.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavigationComponent,
    NotFoundComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    CarsModule,
    FormsModule,
    GuardsModule,
    NgxSpinnerModule,
    ReactiveFormsModule,
    ServicesModule,
    ToastrModule.forRoot(),
    WalletModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
