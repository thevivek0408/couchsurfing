# What is prometheus

Prometheus is a monitoring tool that we use to get data into our dashboards and alerts on [https://couchers.grafana.net/]. Prometheus works by scraping metrics from its data sources. In our case, the app responds to GET requests on port 8000 with a list of numbers and tags. Prometheus regularly calls these endpoints and then forwards the data to a centralized database running Grafana. From there we can use the data for monitoring and alerting.

For more info on prometheus see [https://prometheus.io/] and for more info on Grafana Cloud see [https://grafana.com/products/cloud].
