const fs = require('fs');
const Guid = require('guid');
const express = require('express');
const bodyParser = require("body-parser");
const Mustache  = require('mustache');
const Request  = require('request');
const Querystring  = require('querystring');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
  
var csrf_guid = Guid.raw();
const account_kit_api_version = 'v1.0';
const app_id = '307807109951843';
const app_secret = '7a308769c4522b42b198338708401af4';
const me_endpoint_base_url = 'https://graph.accountkit.com/{{ACCOUNT_KIT_API_VERSION}}/me';
const token_exchange_base_url = 'https://graph.accountkit.com/{{ACCOUNT_KIT_API_VERSION}}/access_token'; 



function loadLoginSuccess() {
  return fs.readFileSync('/login_success.html').toString();
}



app.post('/login_success', function(request, response){

  // CSRF check
  if (request.body.csrf === csrf_guid) {
    var app_access_token = ['AA', app_id, app_secret].join('|');
    var params = {
      grant_type: 'authorization_code',
      code: request.body.code,
      access_token: app_access_token
    };
  
    // exchange tokens
    var token_exchange_url = token_exchange_base_url + '?' + Querystring.stringify(params);
    Request.get({url: token_exchange_url, json: true}, function(err, resp, respBody) {
      var view = {
        user_access_token: respBody.access_token,
        expires_at: respBody.expires_at,
        user_id: respBody.id,	
      };

      // get account details at /me endpoint
      var me_endpoint_url = me_endpoint_base_url + '?access_token=' + respBody.access_token;
      Request.get({url: me_endpoint_url, json:true }, function(err, resp, respBody) {
        // send login_success.html
        if (respBody.phone) {
          view.phone_num = respBody.phone.number;
        } else if (respBody.email) {
          view.email_addr = respBody.email.address;
        }
        var html = Mustache.to_html(loadLoginSuccess(), view);
        response.send(html);
      });
    });
  } 
  else {
    // login failed
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end("Something went wrong. :( ");
  }
});

app.get("*",function(req,res){ 
    res.sendFile('index.html');
})

//app.listen(process.env.PORT);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
console.log(" port : "+process.env.PORT);
