import { AppRoutingModule } from './app.routing';
import { BrowserModule } from '@angular/platform-browser';
import { CarsModule } from './components/cars/cars.module';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { NgxSpinnerModule } from 'ngx-spinner';

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
    BrowserModule,
    CarsModule,
    FormsModule,
    NgxSpinnerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
