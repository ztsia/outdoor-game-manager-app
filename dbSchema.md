## **3\. Database Schema (Firestore)**

**Collection: system\_config** (Global Settings)

* **Document ID:** game\_rules

{  
  "star\_value": 10000,  
  "battle\_cooldown\_minutes": 15, // Time before a territory can be attacked again  
  "rank\_thresholds": {  
    "rising\_star": { "followers": 100000, "stars": 3, "territories": 3 },  
    "legend": { "followers": 1000000, "stars": 10, "fan\_fav": 1 }  
  }  
}

**Collection: locations** (The Physical Spots)

* **Document ID:** loc\_01, loc\_02...

{  
  "name": "Vocal Room",  
  "image\_url": "\[https://imgur.com/\](https://imgur.com/)...", // Public URL to the photo  
  "type": "territory",  
  "assigned\_game\_id": "t\_01"  
}

**Collection: teams**

* **Document ID:** team\_red, team\_blue, ...

{  
  "name": "Team Red",  
  "color": "\#EF4444",  
  "followers": 30000,  
  "rank": "Rookie",  
  "territory\_count": 3,  
  "fan\_favourites": \["game\_japan", "game\_usa"\],  
  "avatar\_url": "..."  
}

**Collection: territories**

* **Document ID:** t\_01, t\_02...

{  
  "location\_id": "loc\_01",  
  "name": "Vocal Room",  
  "location\_image\_url": "...",  
    
  "owner\_id": "team\_red",  
  "stars": 1,  
    
  "under\_attack": false, // TRUE if currently being battled  
  "cooldown\_ends\_at": 1715000000, // Timestamp. NULL if active.  
    
  "current\_attacker\_id": null,  
  "bet\_amount": 0,  
    
  "game\_info": {  
      "title": "Football Brawl",  
      "description\_md": "\#\# Rules...",  
      "win\_condition": "First to 2 goals.",  
      "home\_advantage": "Defender starts with ball.",  
      "has\_timer": true,  
      "timer\_duration\_seconds": 150,  
      "timer\_type": "countdown",  
      "has\_scoreboard": true,  
      "score\_unit": "Goals"  
  },

  "live\_state": {  
      "attacker\_score": 0,  
      "defender\_score": 0,  
      "timer\_started\_at": null,  
      "is\_paused": false  
  }  
}

**Collection: world\_tour\_games**

* **Document ID:** game\_japan...

{  
  "location\_id": "loc\_05",  
  "name": "Japan (Bean Sort)",  
  "location\_image\_url": "...",  
  "high\_score": 45,  
  "high\_score\_holder\_id": "team\_blue",  
  "multiplier\_config": { "normal": 1, "hard": 2, "extreme": 3 },  
  "description\_md": "\#\# How to Play...",  
  "timer\_config": {  
      "has\_timer": true,  
      "duration\_seconds": 60,  
      "type": "countdown"  
  }  
}