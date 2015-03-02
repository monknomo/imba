A project that shows a green ball if all your builds have passed and a red ball if
they've failed.

Just add:
```html
<script src='https://code.jquery.com/jquery-2.1.3.min.js'></script>'
<script src='imba.js'></script>'
```

and
```html
<div id="imbaJenkinsBuildStatus"></div>' 
```

and 

```javascript
var imba = new Imba({
    username: 'username',
    token: 'buildToken',
    jenkinsRootUrl: 'https://myserver/jenkins',
    builds: ['job1', 'job2']
});
```

