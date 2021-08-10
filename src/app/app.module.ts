import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { VirtualScrollTreeComponent } from './components/virtual-scroll-tree/virtual-scroll-tree.component';

@NgModule({
  declarations: [AppComponent, VirtualScrollTreeComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,

    // CdkTableModule,
    CdkTreeModule,
    ScrollingModule,
    MatButtonModule,
    MatTreeModule,
    MatIconModule,
    MatCheckboxModule,

    NzModalModule,
    NzButtonModule,
    NzInputModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
