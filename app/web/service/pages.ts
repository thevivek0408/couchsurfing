import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";
import {
  Coordinate,
  CreateGuideReq,
  CreatePlaceReq,
  GetPageReq,
  UpdatePageReq,
} from "proto/pages_pb";

import client from "./client";

export async function createPlace(
  title: string,
  content: string,
  address: string,
  lat: number,
  lng: number,
  photoKey?: string,
) {
  const req = new CreatePlaceReq();
  req.setTitle(title);
  req.setContent(content);
  req.setAddress(address);
  const coordinate = new Coordinate();
  coordinate.setLat(lat);
  coordinate.setLng(lng);
  req.setLocation(coordinate);
  if (photoKey) req.setPhotoKey(photoKey);

  const response = await client.pages.createPlace(req);

  return response.toObject();
}

export async function createGuide(
  title: string,
  content: string,
  parentCommunityId: number,
  address: string,
  lat?: number,
  lng?: number,
) {
  const req = new CreateGuideReq();
  req.setTitle(title);
  req.setContent(content);
  req.setAddress(address);
  if (lat && lng) {
    const coordinate = new Coordinate();
    coordinate.setLat(lat);
    coordinate.setLng(lng);
    req.setLocation(coordinate);
  }
  req.setParentCommunityId(parentCommunityId);
  const response = await client.pages.createGuide(req);

  return response.toObject();
}

export async function getPage(pageId: number) {
  const req = new GetPageReq();
  req.setPageId(pageId);
  const response = await client.pages.getPage(req);
  return response.toObject();
}

interface UpdatePageInput {
  content?: string;
  pageId: number;
  title?: string;
  photoKey?: string;
}
export async function updatePage({
  content,
  pageId,
  title,
  photoKey,
}: UpdatePageInput) {
  const req = new UpdatePageReq();

  if (photoKey) {
    req.setPhotoKey(new StringValue().setValue(photoKey));
  }

  req.setPageId(pageId);
  if (content) {
    req.setContent(new StringValue().setValue(content));
  }
  if (title) {
    req.setTitle(new StringValue().setValue(title));
  }
  const response = await client.pages.updatePage(req);
  return response.toObject();
}
