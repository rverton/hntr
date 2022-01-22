FROM ubuntu:latest

# install essentials
RUN apt-get update && apt-get install -y curl

# add your custom tools here

# retrieve worker script
ADD https://hntr.unlink.io/worker.sh /worker.sh
RUN chmod +x /worker.sh

ENTRYPOINT ["/worker.sh"]
