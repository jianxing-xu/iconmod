#### Stage iconify-api-install #########################################################################################
FROM node:18-alpine AS iconify-api-install

# Set work directory
WORKDIR /app
COPY [".", "./"]

# Build API
RUN npm install -g yarn --force
RUN yarn
# generate prisma client code
RUN yarn run p:gen
# run ts build
RUN yarn run build


#### Stage RELEASE #####################################################################################################
FROM iconify-api-install AS RELEASE
ARG BUILD_DATE
ARG BUILD_VERSION
ARG BUILD_REF
ARG ICONIFY_API_VERSION
ARG TAG_SUFFIX=default

LABEL org.label-schema.build-date=${BUILD_DATE} \
    org.label-schema.docker.dockerfile="Dockerfile" \
    org.label-schema.license="MIT" \
    org.label-schema.name="Iconify API" \
    org.label-schema.version=${BUILD_VERSION} \
    org.label-schema.description="Node.js version of api.iconify.design" \
    org.label-schema.vcs-ref=${BUILD_REF} \
    org.label-schema.vcs-type="Git"


RUN rm -rf /tmp/*

# Env variables
ENV ICONIFY_API_VERSION=$ICONIFY_API_VERSION

# Expose the listening port of Iconify API
EXPOSE 3131

# Add a healthcheck (default every 30 secs)
HEALTHCHECK CMD curl http://localhost:3131/ || exit 1

CMD npx -y zx ./script/start_before.js && \
    npm run start
