# OfflineMobileExample

This file contains sections of Javascript from a piece of front end work I developed last year. The application was aimed at providing consistent functionality when away from base without internet connection. The system used the 5mb cache localStorage found in almost all modern browsers.  By storing a JSON string of data (which nicely reduced the average data set size to 0.1mb) in this cache, functionality can continue without ever making calls to the server until back at base to upload completed audits.
In conjunction with JQuery Mobile and its HTML pre-loading and caching functionality, the website behaved more like a native mobile application, yet had access to almost every platform with internet browsing capabilities.
