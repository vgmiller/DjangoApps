from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required(login_url="/accounts/login/")
def movie_index(request):
    import os

    from django.conf import settings

    path = os.path.join(settings.STATIC_ROOT, "mediaServer/movies/")
    movies = []
    for root, dirs, files in os.walk(path):
        for filename in files:
            filepath = os.path.join(root, filename)
            filepath = filepath.partition("DjangoApps")[2]
            # 			if pathlib.Path(filename).suffix in [".avi", ".mp4"]:
            # 				filepath = filepath[1:].replace("/", "%2F")
            # 				filepath = '/mediaServer/watch_movie/%s' % filepath
            movies.append((filepath, filename))
    context = {"user": request.user, "movies": movies}
    return render(request, "movie_index.html", context)


@login_required(login_url="/accounts/login/")
def watch_movie(request, movie):
    if movie == "test":
        movie = None
    context = {
        "user": request.user,
        "moviePath": movie,
    }
    return render(request, "movie.html", context)
