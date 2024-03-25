import { LightningElement } from 'lwc';
import getPhoto from '@salesforce/apex/GuestUserController.getPhoto';
import profilePhotoModal from "c/profilePhotoModal";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class ProfilePhotoUploader extends LightningElement {
    currentPhotoUrl = ''
    connectedCallback() {
        getPhoto().then(src => {
            this.currentPhotoUrl = `${src}`
        }).catch(err => console.error(err))  
    }

    async uploadImage(event) {
        event.preventDefault()
        const result = await profilePhotoModal.open({
            size: 'small',
            description: 'Accessible description of modal\'s purpose',
            currentPhotoUrl: this.currentPhotoUrl,
        });
        console.log('result: ', result)
        if (result == 'okay') {
            this.currentPhotoUrl = null;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Successfully update profile picture',
                variant: 'success'
            }))
            console.log('should be in here')
            getPhoto().then(src => {
                console.log('src: ', src)
                this.currentPhotoUrl = `${src}`
            }).catch(err => console.error(err))  
        }
    }
}