import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore'; // Import AngularFirestore
import * as firebase from 'firebase/app';
import { switchMap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { serverTimestamp } from "firebase/firestore"; 
import 'firebase/compat/firestore';

// Rest of your code...

// Import FieldValue from @firebase/firestore
import { FieldValue } from '@firebase/firestore';

export interface User {
  uid: string;
  email: string | null; // Make email nullable
}

export interface Message {
  createdAt: FieldValue; // Use FieldValue imported from @firebase/firestore
  id: string;
  from: string;
  msg: string;
  fromName: string;
  myMsg: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  currentUser: User | null = null;
  
  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore) {
    this.afAuth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUser = { uid: user.uid, email: user.email };
      } else {
        this.currentUser = null;
      }
    });
  }

  async signup({ email, password }: { email: string, password: string }): Promise<any> {
    const credential = await this.afAuth.createUserWithEmailAndPassword(
      email,
      password
    );
  
    if (credential.user) {
      const uid = credential.user.uid;
  
      return this.afs.doc(
        `users/${uid}`
      ).set({
        uid,
        email: credential.user.email,
      })
    } else {
      throw new Error('User creation failed');
    }
  }

  signIn({ email, password }: { email: string, password: string }) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  signOut(): Promise<void> {
    return this.afAuth.signOut();
  }

  // TODO Chat functionality
  
  addChatMessage(msg: string) {
    if (this.currentUser && this.currentUser.uid) {
      return this.afs.collection('messages').add({
        msg: msg,
        from: this.currentUser.uid,
        createdAt: serverTimestamp() // Use serverTimestamp() instead of a function
      });
    } else {
      throw new Error('No user is currently signed in');
    }
  }
  
  getChatMessages() {
    let users: any[] = [];
    return this.getUsers().pipe(
      switchMap(res => {
        users = res;
        return this.afs.collection('messages', ref => ref.orderBy('createdAt')).valueChanges({ idField: 'id' }) as Observable<Message[]>;
      }),
      map(messages => {
        // Get the real name for each user
        for (let m of messages) {
          m.fromName = this.getUserForMsg(m.from, users);
          if (this.currentUser && this.currentUser.uid) {
            m.myMsg = this.currentUser.uid === m.from;
          }
        }
        return messages
      })
    )
  }
  
  private getUsers() {
    return this.afs.collection('users').valueChanges({ idField: 'uid' }) as Observable<User[]>;
  }
  
  private getUserForMsg(msgFromId: string, users: User[]): string {
    for (let usr of users) {
      if (usr.uid == msgFromId) {
        return usr.email ? usr.email : 'Deleted';
      }
    }
    return 'Deleted';
  }
}