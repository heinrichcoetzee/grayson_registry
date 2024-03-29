import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { SnotifyService } from 'ng-snotify';

export interface IGift {
  key?:string;
  name:string;
  description:string;
  url:string;
  requestedQuantity:number;
  totalClaimed?:number;
  unclaimName?:string;
  showClaimed?:boolean;
  showUnclaimed?:boolean;
  unclaimedBy?:string;
  unclaimQuantity?:number;
  claims?:Array<IClaim>;
  claimQuantity?:number;
  claimedBy?:string;
  unclaims?:Array<IClaim>;
}
export interface IClaim {
  claimedBy:string;
  quantity:number;
  id:string;
}

@Component({
  selector: 'app-registry',
  templateUrl: './registry.component.html',
  styleUrls: ['./registry.component.scss']
})
export class RegistryComponent implements OnInit {
  gifts:Observable<any>;
  searchText:string = "";
  showSearch:boolean = false;
  constructor(private db:AngularFirestore,private notify:SnotifyService){
    this.gifts = this.db.collection('gifts',ref=>ref.orderBy('name')).snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({ key: c.payload.doc.id, ...c.payload.doc.data() }))
      )
    )
  }

  ngOnInit(){
    
  }



  unclaimGift(gift:IGift){
    if(typeof gift.unclaimedBy == "undefined"|| gift.unclaimedBy == ""){
      this.notify.simple('Please Enter Your Name');
        return;
    }
    if(gift.unclaimQuantity == 0){
      this.notify.simple('Please Enter the amount of items you want to remove');
      return;
    }

    let find = gift.claims.find(g=>g.claimedBy.toLowerCase()==gift.unclaimedBy.toLowerCase());
    if(typeof find != 'undefined'){
      let claim:IClaim = {
        quantity:gift.unclaimQuantity,
        claimedBy:gift.unclaimedBy,
        id:this.db.createId()
      };
      gift.unclaims = typeof gift.unclaims == 'undefined'?[]:gift.unclaims;
      gift.unclaims.push(claim);
      gift.totalClaimed -= gift.unclaimQuantity;
      delete gift.unclaimQuantity;
      delete gift.unclaimedBy;
      delete gift.showClaimed;
      delete gift.showUnclaimed;
      delete gift.claimedBy;
      delete gift.claimQuantity;
      this.db.collection('gifts').doc(gift.key).update(gift);
    }else{
      this.notify.simple(gift.unclaimedBy +" has not claimed a gift.");
    }

  }

  claimGift(gift:IGift){
    if(typeof gift.claimedBy == "undefined" || gift.claimedBy == ""){
      this.notify.simple('Please Enter Your Name');
        return;
    }
    if(typeof gift.claimQuantity == 'undefined' || gift.claimQuantity == 0){
      this.notify.simple('Please Enter the amount of items you want to claim');
      return;
    }
    
    let claim:IClaim = {
      quantity:gift.claimQuantity,
      claimedBy:gift.claimedBy,
      id:this.db.createId()
    };
    gift.claims = typeof gift.claims == 'undefined'?[]:gift.claims;
    gift.claims.push(claim);
    gift.totalClaimed = typeof gift.totalClaimed=='undefined'?0:gift.totalClaimed;
    gift.totalClaimed += gift.claimQuantity;

    delete gift.unclaimQuantity;
    delete gift.unclaimedBy;
    delete gift.showClaimed;
    delete gift.showUnclaimed;
    delete gift.claimedBy;
    delete gift.claimQuantity;
    console.log("GIFT Claimed",gift);
    this.db.collection('gifts').doc(gift.key).update(gift);
  };

}
