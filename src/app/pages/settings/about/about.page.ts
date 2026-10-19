import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss']
})
export class AboutPage {
  readonly appInfo = {
    name: 'Hidromemoria',
    version: '1.0.0',
    description:
      'Sistema de información geográfica para reportar y visualizar inundaciones en tiempo real.',
    project:
      'Frontend hecho con Angular + Ionic + Leaflet/OpenStreetMap. Backend en Node.js + Express, ' +
      'con PostgreSQL/PostGIS para el manejo de información geográfica.'
  };
}
