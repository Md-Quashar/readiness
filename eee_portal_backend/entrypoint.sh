#!/bin/sh
set -e

# Wait for DB if host/port are provided
if [ -n "$DJANGO_DB_HOST" ] && [ -n "$DJANGO_DB_PORT" ]; then
  echo "Waiting for database at $DJANGO_DB_HOST:$DJANGO_DB_PORT..."
  while ! nc -z $DJANGO_DB_HOST $DJANGO_DB_PORT; do
    sleep 1
  done
fi

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Starting Gunicorn..."
gunicorn eee_portal.wsgi:application --bind 0.0.0.0:8000
