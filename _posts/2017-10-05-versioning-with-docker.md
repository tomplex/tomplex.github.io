---
layout: post
title: Versioning Your Apps With Docker
date: 2017-10-05
categories: [docker]
comments: true
---

[Docker](https://www.docker.com/) is all the rage right now, and rightly so. Having full, unfettered control over the environment your application runs in is appealing to lots of folks, and on its own is enough to make containerization worth it. However, there's another usage of Docker that I believe is often overlooked, and that's the ability to quickly and easily version your applications.

#### Basic versioning

As an example, let's start off with a simple python / flask application which prints "hello world" when you navigate to the index.

{% highlight python %}
# basic_flask_app.py 

from flask import Flask

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
	return "hello, world!"
	
if __name__ == '__main__':
	app.run('0.0.0.0')
{% endhighlight %}

We'll also need a `requirements.txt`:

{% highlight ini %}
click==6.7
Flask==0.12.2
itsdangerous==0.24
Jinja2==2.9.6
MarkupSafe==1.0
Werkzeug==0.12.2
{% endhighlight %}

And a Dockerfile to build:

{% highlight docker %}
FROM python:3.6

COPY . /flask

RUN pip install -r /flask/requirements.txt

ENTRYPOINT  ["python", "/flask/basic_flask_app.py"]
{% endhighlight %}

Now we're ready to build the first version of our app. Make sure all three files are created in the same directory, and in the terminal, run:

```
docker build -t flask:1 .
```

This command will use the instructions in the `Dockerfile` to create a new docker image.  Importantly, we give our new image a *name* -- flask -- and we give it a *tag* of 1. This is what the `-t` flag does; we specify this in the form of `NAME[:TAG]` We've now versioned our application using docker, and specified that our image `flask` has a currently accessible version, `1`. 

We can run our app's image with this command:

```
docker run --rm --name my-flask -p 5000:5000 flask:1
```

You should be able to navigate to `http://localhost:5000/` and see the message "hello, world".

#### Adding new versions

Let's say we want to release a new version of our awesome flask app. We've changed our endpoint so that we can specify a name to say hello to when we navigate there:

{% highlight python %}
# basic_flask_app.py 

from flask import Flask

app = Flask(__name__)

@app.route('/<name>', methods=['GET'])
def index(name):
	return f"hello, {name}!"
	
if __name__ == '__main__':
	app.run('0.0.0.0')
{% endhighlight %}

Great! Now, we can re-build our image, and increment the tag to reflect our new version:

```
docker build -t flask:2 .
```

Once it's finished building, we can stop our original container (hit ctrl-c in the terminal you ran it in) and re-run it, but specify the `flask:2` image:

```
docker run --rm --name my-flask -p 5000:5000 flask:2
```

We can now navigate to `http://localhost:5000/tom`, and our app will greet us as such:

```
hello, tom!
```

#### What's the point?

You might be asking yourself, why do I care? Well, even though we've changed our code, we still have a copy of our application exactly as it was when it was version 1, and with a simple command, can re-deploy that old version if necessary. If you over-wrote your application's old docker image, or weren't using docker at all before, then in order to deploy an old version of your app, you'd need to go check out a different version's branch, or go hunt down the proper commit in your repository's history. 

The point is, with explictly versioned docker containers, deploying an older version of your application (or a newer one once you've fixed your silly mistake) is damn near trivial. 


#### Advanced Workflows

If you're using CI tools like Jenkins or Travis-ci for your development, then you can take this a step further, and set up automatically versioned builds & deployments of your applications. With Jenkins as an example, you can set up a jenkins job which will trigger on a push to your master branch. When the job runs, have it pull your applications repo & execute a shell script like this:

{% highlight bash %}
#!/bin/bash

SERVICE=flask
TAG=${BUILD_NUMBER}

docker build -t ${SERVICE}:${TAG} .
docker tag ${SERVICE}:${TAG} ${SERVICE}:latest
{% endhighlight %}

This way, on every push to master, you'll have a nicely versioned copy of your application's current working state, that will also be tagged "latest" which is a convenient way to be able to get the most recent build of your application without having to know what the specific build number is, but you'll still have access to older builds.

#### Conclusion

I hope I've managed to convince you of the value of rigorously tagging & versioning your application's docker images. The truth is, with a programming language like Java where you compile your code into a .jar file, a lot of this is already taken care of for you; you can have multiple copies of your binaries hanging around to run previous versions. For a language like Python where there are no binaries, having older versions of your application hanging out is harder to manage unless you strictly follow a [git flow](https://datasift.github.io/gitflow/IntroducingGitFlow.html) approach with release branches. However, the extra advantage here is that you not only have a versioned copy of your application's source code, but you also have a versioned copy of its *full environment* at that given time, as well. It might seem like a lot of extra work for a just little bit of reward, but the first time you find your application is behaving unexpectedly, the simple fix of executing `docker run my_app:previous_version` will be worth it!

Note: All code for this blog post can be found [here](https://github.com/tomplex/blog-versioning-with-docker).
