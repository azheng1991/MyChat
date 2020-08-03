import React, { Component } from "react";
import { View, StyleSheet, Text } from "react-native";

import { GiftedChat } from "react-native-gifted-chat";
import { color } from "react-native-reanimated";

// import firestore/firebase
const firebase = require("firebase");
require("firebase/firestore");

export default class Chat extends Component {
  constructor() {
    super();
    this.state = {
      messages: [],
      user: {
        _id: "",
        name: "",
        avatar: "",
      },
      loggedInText: "",
    };

    // connect to firestore
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyCZbd3DNWaDHvZx5C8fdLCNLGFQCpdjEHE",
        authDomain: "hello-world-bf027.firebaseapp.com",
        databaseURL: "https://hello-world-bf027.firebaseio.com",
        projectId: "hello-world-bf027",
        storageBucket: "hello-world-bf027.appspot.com",
        messagingSenderId: "966926622384",
        appId: "1:966926622384:web:426f7aa6f2c0a8a03d2575",
        measurementId: "G-CE5CLS0MY0",
      });
    }
    // reference to messages collection
    this.referenceMessages = firebase.firestore().collection("messages");
  }

  //authenticates the user, sets the state to send messages and unsubscribes Firestone
  componentDidMount() {
    this.authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        try {
          await firebase.auth().signInAnonymously();
          console.log(user);
        } catch (error) {
          console.log(`Unable to sign in: ${error.message}`);
        }
      }
      this.setState({
        user: {
          _id: user.uid,
          name: this.props.route.params.name,
          avatar: "https://placeimg.com/140/140/any",
        },
        loggedInText: `${this.props.route.params.name} has entered the chat`,
        messages: [],
      });
      this.unsubscribe = this.referenceMessages
        .orderBy("createdAt", "desc")
        .onSnapshot(this.onCollectionUpdate);
    });
  }

  //unsubscribes componentDidMount()
  componentWillUnmount() {
    this.authUnsubscribe();
    this.unsubscribe();
  }

  //Function to send messages
  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.addMessages();
      }
    );
  }

  //Updates the messages in the state
  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // loop through documents
    querySnapshot.forEach((doc) => {
      // get data snapshot
      const data = doc.data();

      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar,
        },
      });
    });
    this.setState({
      messages,
    });
  };

  //Pushes messages to Firestore database
  addMessages = () => {
    const message = this.state.messages[0];
    this.referenceMessages.add({
      _id: message._id,
      text: message.text || "",
      createdAt: message.createdAt,
      user: message.user,
      sent: true,
    });
  };

  render() {
    //Get seleceted background color
    let bcolor = this.props.route.params.color;

    //Get selected user name
    let name = this.props.route.params.name;

    //Set title to username
    this.props.navigation.setOptions({ title: name });

    return (
      <View
        style={{
          flex: 1,
          //Set background color to selected
          backgroundColor: bcolor,
        }}
      >
        <Text>{this.state.loggedInText}</Text>

        <GiftedChat
          messages={this.state.messages}
          onSend={(messages) => this.onSend(messages)}
          user={this.state.user}
        />
      </View>
    );
  }
}
