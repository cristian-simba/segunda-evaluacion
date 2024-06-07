import { Component, AfterViewInit } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import {
  NativeGeocoder,
  NativeGeocoderResult,
  NativeGeocoderOptions,
} from '@ionic-native/native-geocoder/ngx';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import * as L from 'leaflet';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit {
  latitude: number = 0;
  longitude: number = 0;
  address: string = '';
  map: L.Map;
  marker: L.Marker;

  constructor(
    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
    private firestore: AngularFirestore
  ) {}

  options = {
    timeout: 10000,
    enableHighAccuracy: true,
    maximumAge: 3600,
  };

  nativeGeocoderOptions: NativeGeocoderOptions = {
    useLocale: true,
    maxResults: 5,
  };

  ngAfterViewInit() {
    this.initMap();
    this.getCurrentCoordinates();
  }

  initMap() {
    this.map = L.map('map').setView([this.latitude, this.longitude], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map);
    this.marker.bindPopup("Ubicación Exacta").openPopup(); // Añade un popup al marcador
  }

  updateMapCenter(lat: number, lng: number) {
    if (this.map && this.marker) {
      const newLatLng = new L.LatLng(lat, lng);
      this.map.setView(newLatLng, 15);
      this.marker.setLatLng(newLatLng);
      this.marker.bindPopup(this.address).openPopup();
      this.map.invalidateSize();
    }
  }

  getCurrentCoordinates() {
    this.geolocation
      .getCurrentPosition()
      .then((resp) => {
        this.latitude = resp.coords.latitude;
        this.longitude = resp.coords.longitude;
        this.updateMapCenter(this.latitude, this.longitude);
        this.getAddress(this.latitude, this.longitude);
        this.sendCoordinatesToFirebase(this.latitude, this.longitude);
      })
      // .catch((error) => {
      //   console.log('Error getting location', error);
      // });
  }

  getAddress(lat: number, long: number) {
    this.nativeGeocoder
      .reverseGeocode(lat, long, this.nativeGeocoderOptions)
      .then((res: NativeGeocoderResult[]) => {
        this.address = this.pretifyAddress(res[0]);
        this.updateMapCenter(lat, long);
      })
      // .catch((error: any) => {
      //   alert('Error getting location' + JSON.stringify(error));
      // });
  }

  pretifyAddress(address: any) {
    let obj = [];
    let data = '';
    for (let key in address) {
      obj.push(address[key]);
    }
    obj.reverse();
    for (let val in obj) {
      if (obj[val].length) data += obj[val] + ', ';
    }
    return data.slice(0, -2);
  }

  sendCoordinatesToFirebase(lat: number, long: number) {
    const coordinates = {
      latitude: lat,
      longitude: long,
      timestamp: new Date(),
      nombre: 'Cristian',
    };
    this.firestore.collection('Localizacion').add(coordinates)
      .then(() => {
        console.log('Coordenadas enviadas a Firebase');
      })
      .catch((error) => {
        console.error('Error al enviar coordenadas a Firebase', error);
      });
  }
}
