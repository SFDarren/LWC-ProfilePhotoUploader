import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import uploadFile from '@salesforce/apex/GuestUserController.uploadFile'
import CommunityId from "@salesforce/community/Id";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class ProfilePhotoModal extends LightningModal {
    communityId = CommunityId;
    @api currentPhotoUrl;
    @api userId;

    // handle file upload, create url as img src
    @track uploadedImage
    uploadedImageUrl;
    handleFileUpload(event) {
        this.uploadedImage = event.target.files?.[0];
        if (this.uploadedImage) {
            this.uploadedImageUrl = URL.createObjectURL(this.uploadedImage)
        }
    }

    ratioLessThanOne
    zoomIncrement
    maxLeft
    maxTop
    minLeft
    minTop
    // render image to 190 x 190 container
    handleImageLoad() {
        let intristicHeight = this.refs.uploaded.naturalHeight;
        let newHeight = 190
        let ratio = (newHeight / intristicHeight)
        console.log('ratio: ', ratio)
        this.ratioLessThanOne = ratio < 1
        let newWidth = this.refs.uploaded.naturalWidth * ratio
        this.refs.uploaded.setAttribute('width', newWidth);
        this.refs.uploaded.setAttribute('height', newHeight);
        let left = (290 - this.refs.uploaded.width) / 2
        this.refs.uploadedContainer.style.left = `${left}px`

        // bounds of dragging, we started at top: 50, left: 50 to center a 190 x 190 image in a 290 x 290 container
        this.maxLeft = 50;
        this.maxTop = 50;
        this.minLeft = 190 + 50 - newWidth //negative
        this.minTop = 190 + 50 - newHeight //negative

        // Max zoom of 3 * original size of image
        this.zoomIncrement = (1/ratio * 3) * 190/100
    }

    zoomed = 0;
    handleZoom(event) {
        let increased = event.target.value * this.zoomIncrement
        let newHeight = 190 + increased;
        
        let ratio = (newHeight / this.refs.uploaded.naturalHeight)
        let newWidth = this.refs.uploaded.naturalWidth * ratio

        let previousCenterLeft = (290 - this.refs.uploaded.width) / 2
        let previousActualLeft = this.refs.uploadedContainer.offsetLeft;
        let offsetLeft = previousActualLeft - previousCenterLeft

        let previousCenterTop = (290 - this.refs.uploaded.height) / 2
        let previousActualTop = this.refs.uploadedContainer.offsetTop;
        let offsetTop = previousActualTop - previousCenterTop


        this.refs.uploaded.setAttribute('width', newWidth);
        this.refs.uploaded.setAttribute('height', newHeight);


        // max doesn't change, update min
        this.minLeft = 190 + 50 - newWidth //negative
        console.log('min left: ' , this.minLeft);
        this.minTop = 190 + 50 - newHeight //negative

        let newCenterLeft = (290 - newWidth) / 2
        let newActualLeft = newCenterLeft + offsetLeft > this.maxLeft ? this.maxLeft :
                                newCenterLeft + offsetLeft < this.minLeft ? this.minLeft :
                                newCenterLeft + offsetLeft
        let newCenterTop = (290 - newHeight) / 2
        let newActualTop = newCenterTop + offsetTop > this.maxTop ? this.maxTop :
                                newCenterTop + offsetTop < this.minTop ? this.minTop :
                                newCenterTop + offsetTop

        this.refs.uploadedContainer.style.left = `${newActualLeft}px`
        this.refs.uploadedContainer.style.top = `${newActualTop}px`
    }

    offset = [0,0]
    isDown = false
    handleMouseDown(e) {
        this.isDown = true;
        this.offset = [
            this.refs.uploadedContainer.offsetLeft - e.clientX,
            this.refs.uploadedContainer.offsetTop - e.clientY
        ];
        console.log('this.offset: ', JSON.stringify(this.offset))
    }

    // arrow functions keep 'this' reference
    connectedCallback() {
        window.addEventListener('mouseup', this.handleMouseUp)
        window.addEventListener('mousemove', this.handleMouseMove) 
    }

    handleMouseUp = () => {
        this.isDown = false;
    }

    handleMouseMove = (e) => {
        if (this.isDown) {
            e.preventDefault();
            let left = e.clientX + this.offset[0] > this.maxLeft ? this.maxLeft :
                        e.clientX + this.offset[0] < this.minLeft ? this.minLeft :
                        e.clientX + this.offset[0]

            let top = e.clientY + this.offset[1] > this.maxTop ? this.maxTop :
                        e.clientY + this.offset[1] < this.minTop ? this.minTop :
                        e.clientY + this.offset[1]
            this.refs.uploadedContainer.style.left = left + 'px';
            this.refs.uploadedContainer.style.top = top + 'px';
        }
    }

    get disableButtons() {
        return this.showSpinner;
    }
    
    showSpinner
    handleSave() { 
        this.showSpinner = true;
        let sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight,
                img     = this.refs.uploaded,
                canvas  = this.refs.canvas,
                context = canvas.getContext("2d");
        
        // canvas will draw by original height/width, hence we need to find the ratio back
        let ratio = (img.offsetHeight / this.refs.uploaded.naturalHeight)
        sx = (50 - this.refs.uploadedContainer.offsetLeft ) / ratio
        sy = (50 - this.refs.uploadedContainer.offsetTop  ) / ratio
        sWidth = 190 / ratio
        sHeight = 190 / ratio
        dx = 0
        dy = 0
        dWidth = 190
        dHeight = 190
        context.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

        uploadFile({communityId: this.communityId, imageBase64: canvas.toDataURL().split(';base64,')[1]})
        .then(result => {
            this.close('okay');
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({title: 'Save Image Error', message: error, variant: 'error'}));
        })
        .finally(() => {
            this.showSpinner = false;
        })
        
    }

    handleCancel() {
        this.close();
    }
}