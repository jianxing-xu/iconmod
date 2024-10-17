#!/bin/bash -e
# This file is used to build the Docker image
# Examples:
#./docker.sh
#./docker.sh arm64v8

# To test the docker image a command like this can be used:
#docker run --rm -p 3123:3000 --name iconify-api -v $(realpath "../iconify-cache"):/data/iconify-api/cache -v $(realpath "../iconify-config"):/data/iconify-api/src/config iconify/api:latest
#docker run --rm -p 3123:3000 --name iconify-api -v /absolute/path/iconify-cache:/data/iconify-api/cache -v /absolute/path/iconify-config:/data/iconify-api/src/config iconify/api:latest
DOCKER_REPO=iconmod-server
ICONIFY_API_REPO=$(realpath "./")
BUILD_SOURCE=$(realpath "./")
SHARED_DIR=$BUILD_SOURCE/../shared
DOCKERFILE=$(realpath "./Dockerfile")
SRC_PATH="./"
if [ -z "$1" ]; then
    ARCH=amd64
    # ARCH=arm64v8
else
    ARCH=$1
fi
echo "Starting to build for arch: $ARCH"
echo "Build BASE dir: $BUILD_SOURCE"

export ICONIFY_API_VERSION=$(grep -oE "\"version\": \"([0-9]+.[0-9]+.[a-z0-9.-]+)" $ICONIFY_API_REPO/package.json | cut -d\" -f4)

echo "Iconify API version: ${ICONIFY_API_VERSION}"


time docker build --rm=false \
    --no-cache \
    --build-arg ARCH=$ARCH \
    --build-arg ICONIFY_API_VERSION=${ICONIFY_API_VERSION} \
    --build-arg BUILD_DATE="$(date +"%Y-%m-%dT%H:%M:%SZ")" \
    --build-arg TAG_SUFFIX=default \
	--build-arg SRC_PATH="$SRC_PATH" \
    --file $DOCKERFILE \
    --tag ${DOCKER_REPO}:latest $BUILD_SOURCE
    # --tag ${DOCKER_REPO}:latest --tag ${DOCKER_REPO}:${ICONIFY_API_VERSION} $BUILD_SOURCE

rm -fR $BUILD_SOURCE/tmp
