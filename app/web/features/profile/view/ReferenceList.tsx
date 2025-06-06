import { List } from "@mui/material";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { ListReferencesRes } from "proto/references_pb";
import makeStyles from "utils/makeStyles";

import ReferenceListItem from "./ReferenceListItem";

const useStyles = makeStyles((theme) => ({
  referencesList: {
    "& > *": {
      paddingBlockEnd: theme.spacing(3),
    },
    width: "100%",
    overflow: "hidden",
  },
}));

interface ReferenceListProps {
  isReceived?: boolean;
  referencePages: ListReferencesRes.AsObject[];
  referenceUsers: ReturnType<typeof useLiteUsers>["data"];
}

export default function ReferenceList({
  isReceived,
  referencePages,
  referenceUsers,
}: ReferenceListProps) {
  const classes = useStyles();

  return (
    <List className={classes.referencesList}>
      {referencePages
        .map((page) =>
          page.referencesList.map((reference) => {
            const userToShow = referenceUsers?.get(
              isReceived ? reference.fromUserId : reference.toUserId,
            );
            return userToShow ? (
              <ReferenceListItem
                key={reference.referenceId}
                isReceived
                user={userToShow}
                reference={reference}
              />
            ) : null;
          }),
        )
        .flat()}
    </List>
  );
}
