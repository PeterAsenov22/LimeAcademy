import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NavigationComponent } from './components/shared/navigation/navigation.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavigationComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
