import { LightningElement,api,wire,track } from 'lwc';
import getAllReviews from '@salesforce/apex/BoatDataService.getAllReviews';
import { NavigationMixin } from 'lightning/navigation';

// imports
export default class BoatReviews extends NavigationMixin(LightningElement) {
    // Private
    boatId;
    error;
    @track boatReviews;
    @track isLoading;
    
    // Getter and Setter to allow for logic to run on recordId change
    @api
    get recordId() {
        return this.boatId;
    }

    set recordId(value) {
        this.boatId=value;
      //sets boatId attribute
      //sets boatId assignment
      //get reviews associated with boatId
        this.getReviews();
    }
    
    // Getter to determine if there are reviews to display
    get reviewsToShow() {
        return (this.boatReviews && this.boatReviews.length)>0?true:false;
    }
    
    // Public method to force a refresh of the reviews invoking getReviews
    @api
    refresh() { 
        this.getReviews();
    }
    
    // Imperative Apex call to get reviews for given boat
    // returns immediately if boatId is empty or null
    // sets isLoading to true during the process and false when it’s completed
    // Gets all the boatReviews from the result, checking for errors.
    getReviews() {
        if(!this.boatId) return;
        this.isLoading=true;
        getAllReviews({boatId:this.boatId})
        .then(result => {
            this.isLoading=false;
            this.boatReviews = result.map(e=>({...e,link:'?data-record-id='+e.CreatedBy.Id}));
        })
        .catch(error => {
            this.isLoading=false;
            this.error = error;
        });
    }
    
    // Helper method to use NavigationMixin to navigate to a given record on click
    navigateToRecord(event) { debugger
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
              recordId: event.target.getAttribute('data-record-id'),
                actionName: "view"
            },
        });
    }
}
  