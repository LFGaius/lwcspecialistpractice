import { LightningElement,api,track, wire } from 'lwc';
import { publish,subscribe, MessageContext } from 'lightning/messageService';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT     = 'Ship it!';
const SUCCESS_VARIANT     = 'success';
const ERROR_TITLE   = 'Error';
const ERROR_VARIANT = 'error';
const columns = [
  { label: 'Name', fieldName: 'Name', editable: true },
  { label: 'Length', fieldName: 'Length__c', type: 'number', editable: true },
  { label: 'Price', fieldName: 'Price__c', type: 'currency', editable: true },
  { label: 'Description', fieldName: 'Description__c', editable: true },
];
export default class BoatSearchResults extends LightningElement {
  selectedBoatId;
  columns = columns;
  boatTypeId = '';
  @track BoatResults;
  @track boats;
  @track isLoading = false;
  @track draftValues=[];
  
  @wire(MessageContext)
  messageContext;

  get vl(){
    return this.BoatResults.data[0].Name
  }

  

  // wired getBoats method
  @wire(getBoats,{boatTypeId:'$boatTypeId'})
  wiredBoats(result) { debugger
    this.BoatResults=result;
    
    if(result.data){
      console.log(this.BoatResults.data[0].Name)
      this.boats=result.data;
      // this.isLoading=false;
      // this.notifyLoading();
    }
  }
  
  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  @api
  searchBoats(boatTypeId) {
    this.boatTypeId=boatTypeId;
    this.isLoading=true;
    this.notifyLoading();
  }
  
  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  @api
  async refresh() {
    this.isLoading=true;
    this.notifyLoading();
    return await refreshApex(this.BoatResults);
  }
  
  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) {
    this.selectedBoatId=event.detail.boatId;
    this.sendMessageService(this.selectedBoatId);
  }
  
  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) { 
    const payload = { recordId: boatId};
    publish(this.messageContext, BOATMC, payload);
    // explicitly pass boatId to the parameter recordId
  }
  
  // This method must save the changes in the Boat Editor
  // Show a toast message with the title
  // clear lightning-datatable draft values
  handleSave(event) {
    const recordInputs = event.detail.draftValues.slice().map(draft => {
        const fields = Object.assign({}, draft);
        return { fields };
    });
    const promises = recordInputs.map(recordInput=>{
      const fields = {};
      const ind=parseInt(recordInput.fields.id.split("-")[1],10);
      fields['Id'] = this.boats[ind].Id;
      if(recordInput.fields.Name)
        fields['Name'] = recordInput.fields.Name;
      if(recordInput.fields.Length__c)
        fields['Length__c'] = recordInput.fields.Length__c;
      if(recordInput.fields.Price__c)
        fields['Price__c'] = recordInput.fields.Price__c;
      if(recordInput.fields.Description__c)
        fields['Description__c'] = recordInput.fields.Description__c;
      const _recordInput = { fields };
      updateRecord(_recordInput)
          .then((data) => {
              return Promise.resolve();
          })
          .catch(error => {
            return Promise.reject();
          });
      
    });
    Promise.all(promises)
        .then((data) => {
          this.refresh().then(()=>{
            this.draftValues=[];
            this.isLoading=false;
            this.notifyLoading();
            const event = new ShowToastEvent({
                title: SUCCESS_TITLE,
                message:MESSAGE_SHIP_IT,
                variant:SUCCESS_VARIANT
            });
            this.dispatchEvent(event);
          })
          
        })
        .catch(error => {
          const event = new ShowToastEvent({
              title: ERROR_TITLE,
              variant:ERROR_VARIANT
          });
          this.dispatchEvent(event);
        })
        .finally(() => {
        });
  }
  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) {
    if(this.isLoading)
      this.dispatchEvent(new CustomEvent('loading'));
    else
      this.dispatchEvent(new CustomEvent('doneloading'));
  }
}