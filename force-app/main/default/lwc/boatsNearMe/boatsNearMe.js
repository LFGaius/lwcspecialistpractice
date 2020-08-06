import { LightningElement,wire,api,track } from 'lwc';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getBoatsByLocation from '@salesforce/apex/BoatDataService.getBoatsByLocation';
const LABEL_YOU_ARE_HERE = 'You are here!';
const ICON_STANDARD_USER = 'standard:user';
const ERROR_TITLE = 'Error loading Boats Near Me';
const ERROR_VARIANT = 'error';
export default class BoatsNearMe extends LightningElement {
    @api boatTypeId;
    @track mapMarkers = [];
    @track isLoading = true;
    @track isRendered;
    @track latitude;
    @track longitude;
  
    // Add the wired method from the Apex Class
    // Name it getBoatsByLocation, and use latitude, longitude and boatTypeId
    // Handle the result and calls createMapMarkers
    @wire(getBoatsByLocation,{latitude:'$latitude',longitude:'$longitude',boatTypeId:'$boatTypeId'})
    wiredBoatsJSON({error, data}) {
        if(data){debugger
            this.createMapMarkers(data);
        }else{
            if(error){
                this.isLoading=false;
                const event = new ShowToastEvent({
                    title: ERROR_TITLE,
                    variant:ERROR_VARIANT
                });
                this.dispatchEvent(event);
            }
        }
    }

    // Controls the isRendered property
    // Calls getLocationFromBrowser()
    renderedCallback() { debugger
        if(!this.isRendered)
            this.getLocationFromBrowser();
        this.isRendered=true;
    }

    // Gets the location from the Browser
    // position => {latitude and longitude}
    getLocationFromBrowser() {
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position)=>{
                this.latitude=position.coords.latitude;
                this.longitude=position.coords.longitude;
            });
        }
     }

    // Creates the map markers
    createMapMarkers(boatData) {
        const newMarkers = JSON.parse(boatData).map(boatItem => {
            return {
                location: {
                    Latitude: boatItem.Geolocation__Latitude__s,
                    Longitude: boatItem.Geolocation__Longitude__s
                },
                title: boatItem.Name
            }
        });
        newMarkers.unshift({
            location: {
                Latitude: this.latitude,
                Longitude: this.longitude
            },
            title: LABEL_YOU_ARE_HERE,
            icon: ICON_STANDARD_USER
        });
        this.mapMarkers= newMarkers;
        this.isLoading= false;
    }
}