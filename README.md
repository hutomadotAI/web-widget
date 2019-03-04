# Hu:toma web-widget

Hu:toma Widget provides a rich set of client-side functionality similar to one provided by Facebook Messenger.

## Local development

Please read before you start coding

### Set local configuration

Add a new file called `config.env.js` under `src/` directory in your local copy of the project. Settings can slightly vary depending on local setup, example one:

```
export const SERVICE = 'local.hutoma.widget';
export const HUTOMA_ORIGIN = 'https://0.0.0.0.xip.io:8443';
export const WIDGET_IFRAME_URL = 'https://0.0.0.0.xip.io:8443/widget/index.html';
```

Any `*.env.js` files are excluded in `gitignore`

In the nginx folder there are two empty files, cert.key and cert.pem, you need to populate these before you build for your local testing.

### Run your local widget container using Docker

```
$ docker-compose up server
```

Enter following installation code in an online editor of your choice, at first run you'll need to accept self-signed certificates. Update the code with your bot name `bot_name` and `my_bot_token`. 

```
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>Web Widget</title>
  </head>
  <body>

    <script>(function() {document.head.appendChild(Object.assign(document.createElement('script'),{
      src: 'https://0.0.0.0.xip.io:8443/widget/widget.js', type: 'module'
    }))})();</script>

    <script>
      var hutoma = window.hutoma || [];
        
      hutoma.push(['boot', 'bot_name', {
        'token': 'CLIENT_TOKEN',
        'languageCode': 'en-US'
      }]);

    </script>
  </body>
</html>
```

Example at Jsbin:
https://jsbin.com/mucipo/edit?html,console,output

For more complex commands please check [the documentation](https://help.hutoma.ai/article/3gm9m9f0th-web-widget-integration)

## I18l

Translations are kept in `local/` directory, new can be added manually or using [Poedit](https://poedit.net/). During the deploy translation, JSON files are created. To create a local copy install Node packages locally or using a Node container, and run `yarn run translate`.

## Project links

* [Repository (GitHub)](https://github.com/hutomadotAI/web-widget)

### Examples

* [Local development](https://jsbin.com/mucipo/edit?html,output)
* [Rich answer example](https://jsbin.com/yobuyin/edit?html,output)


