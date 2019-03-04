exports.sendTemplate = (req, res) => {

  let type = 'chatResult' in req.body ? req.body.chatResult.context.type : 'quick_replies';

  // We support CORS for all requests
  res.set('Access-Control-Allow-Origin', '*');

  // We accept content-type for all requests
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  res.set('Content-Type', 'application/json');

  res.status(200).send(
    JSON.stringify({
      text: `Here’s an example of *${ type }* template`,
      facebook: TEMPLATES[type]
    })
  );

};

const TEMPLATES = {

  quick_replies: {
    text: 'I’m a Quick reply example text',
    quick_replies:[
      {
        content_type: 'text',
        title: 'Simple',
        payload: 'postback_payload',
      },
      {
        content_type: 'text',
        title: 'With image',
        payload: 'postback_payload',
        image_url: 'https://placekitten.com/32/32'
      }
    ]
  },

  button: {
    attachment: {
      type: 'template',
      payload: {
        text: 'I’m a text example',
        buttons: [
          {
            title: 'postback title',
            payload: 'postback_payload_1',
            type: 'postback'
          },
          {
            title: 'postback title',
            payload: 'postback_payload_2',
            type: 'postback'
          }
        ],
        template_type: 'button'
      }
    }
  },

  generic: {
    attachment: {
      type: 'template',
      payload: {
        elements: [
          {
            title: 'Generic template element title 1',
            buttons: [
              {
                type: 'web_url',
                url: 'https://example.com',
                title: 'web_url title'
              },
              {
                type: 'postback',
                title: 'postback',
                payload: 'postback_payload'
              }
            ],
            default_action: {
              webview_height_ratio: 'tall',
              type: 'web_url',
              url: 'https://example.com'
            },
            subtitle: 'subtitle',
            image_url: 'https://placekitten.com/400/300'
          },
          {
            title: 'Generic template element title 2',
            buttons: [
              {
                type: 'web_url',
                url: 'https://example.com',
                title: 'web_url title'
              },
              {
                type: 'web_url',
                url: 'https://example.com',
                title: 'web_url title'
              },
              {
                type: 'postback',
                title: 'postback',
                payload: 'postback_payload'
              }
            ],
            default_action: {
              webview_height_ratio: 'tall',
              type: 'web_url',
              url: 'https://example.com'
            },
            subtitle: 'subtitle',
            image_url: 'https://placekitten.com/400/300'
          }
        ],
        template_type: 'generic',
        sharable: false
      }
    }
  }
};

