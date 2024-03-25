public with sharing class GuestUserController {
    @AuraEnabled
    public static String uploadFile(String communityId, String imageBase64) {
        try {
            System.debug('>>> imageBase64: ' + imageBase64);
            Blob payloadBlob = EncodingUtil.base64Decode(imageBase64);
            ConnectApi.BinaryInput cabi = new ConnectApi.BinaryInput(payloadBlob, 'image/png', (String)System.UserInfo.getUserId()+'_ProfilePicture.png');
            ConnectApi.Photo photo = ConnectApi.UserProfiles.setPhoto(communityId, System.UserInfo.getUserId(), cabi);
            return photo.largePhotoUrl;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string getPhoto(){
        try {
            User u = [Select SmallPhotoUrl, MediumPhotoUrl, FullPhotoUrl 
                        From User where Id=:Userinfo.getUserid()];
            return u.FullPhotoUrl;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}