#!/bin/bash

cd /home/ubuntu

AWS_ACCOUNT_ID="824039889403"
AWS_REGION="ap-south-1"
IMAGE_TAG="latest"
APP_NAME="job-portal/server/staging"

# setting vars
echo $APPLICATION_NAME
if [ "$APPLICATION_NAME" == "job-portal-prod" ]
then
    APP_NAME="job-portal/server/prod"
fi
echo $APP_NAME

# pulling docker image
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker pull $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME:$IMAGE_TAG

# setting env
aws ssm get-parameters-by-path \
    --path "/${APP_NAME}" --recursive --with-decrypt \
    | jq -r '.Parameters[] | (.Name | split("/")[-1]) + "=" + (.Value)' \
    | tee /home/ubuntu/.env

# Stop existing container
docker ps -q --filter "ancestor=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME:$IMAGE_TAG" | xargs -r docker stop

# Remove unused containers and images (optional)
docker system prune -f

# Run Docker container
docker compose up -d

sudo nginx -t
sudo service nginx restart