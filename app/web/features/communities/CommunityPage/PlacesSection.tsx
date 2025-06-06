import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HorizontalScroller from "components/HorizontalScroller";
import { LocationIcon } from "components/Icons";
import TextBody from "components/TextBody";
import { useListPlaces } from "features/communities/hooks";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import React from "react";

import { useCommunityPageStyles } from "./CommunityPage";
import PlaceCard from "./PlaceCard";
import TitleWithIcon from "./TitleWithIcon";

export default function PlacesSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([COMMUNITIES]);
  const classes = useCommunityPageStyles();

  const {
    isLoading: isPlacesLoading,
    error: placesError,
    data: places,
    //hasNextPage: placesHasNextPage,
  } = useListPlaces(community.communityId);

  return (
    <>
      <TitleWithIcon icon={<LocationIcon />}>
        {t("communities:places_title")}
      </TitleWithIcon>
      {placesError && <Alert severity="error">{placesError.message}</Alert>}
      {isPlacesLoading && <CenteredSpinner />}
      <HorizontalScroller className={classes.cardContainer}>
        {places &&
        places.pages.length > 0 &&
        places.pages[0].placesList.length === 0 ? (
          <TextBody>{t("communities:places_empty_state")}</TextBody>
        ) : (
          places?.pages
            .flatMap((res) => res.placesList)
            .map((place) => (
              <PlaceCard
                place={place}
                className={classes.placeEventCard}
                key={`placecard-${place.pageId}`}
              />
            ))
        )}
        {/*placesHasNextPage && (
          <div className={classes.loadMoreButton}>
            <Link
              to={routeToCommunity(
                community.communityId,
                community.slug,
                "places"
              )}
            >
              <IconButton aria-label={SEE_MORE_PLACES_LABEL}>
                <MoreIcon />
              </IconButton>
            </Link>
          </div>
              )*/}
      </HorizontalScroller>
    </>
  );
}
