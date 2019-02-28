var db = require('db');
module.exports = {
    home: 'news',
    current: 'home',
    Page: function(section, callBack, filter = null, userID = 1) {
        var queries = [];
        if (filter == null) {
            filter = {
                column: '',
                filter: ''
            }
        }
        this.current = section;
        switch (section) {
            case 'home':
                this.Home(callBack, filter);
                break;
            case 'news':
                callBack({command: 'news'})
                break;
            case 'corpdir':
                callBack({command: 'directory'})
                break;
            case 'chat':
                callBack(null)
                break;
            case "armail":
                callBack(null)
                break;
            case "upanel":
                callBack(null)
                break;
            case "friends":
                callBack(null)
                break;
            default:
                this.current = 'home';
                break;
        }
    },
    Home: function(resultCallBack, filter = null, userID = 1) {
        this.Page(this.home, resultCallBack, filter, userID);
    }
}