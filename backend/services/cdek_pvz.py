from services.cdek_client import cdek_client


def get_pvz_by_city(city_post_code: str):
    response = cdek_client.get_delivery_points(
        city_post_code=city_post_code
    )
    response = cdek_client.get_delivery_points(city_post_code=city_post_code)['pvz']

    return response
