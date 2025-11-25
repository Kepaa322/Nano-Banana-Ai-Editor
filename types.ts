export enum ImageSize {
  Size1K = '1K',
  Size2K = '2K',
  Size4K = '4K',
}

export enum AspectRatio {
  Square = '1:1',
  Portrait = '3:4',
  Landscape = '4:3',
  Mobile = '9:16',
  Wide = '16:9',
  Cinema = '21:9',
}

export enum CameraAngle {
  Front = 'Front View',
  Back = 'Back View',
  Left = 'Left Side View',
  Right = 'Right Side View',
  Top = 'Top-Down View (Bird\'s Eye)',
  Bottom = 'Bottom-Up View (Worm\'s Eye)',
  Dutch = 'Dutch Angle',
  Isometric = 'Isometric View'
}

export enum TimeOfDay {
  Dawn = 'Dawn',
  Morning = 'Morning',
  Noon = 'Noon',
  GoldenHour = 'Golden Hour',
  Dusk = 'Dusk',
  Night = 'Night',
  Midnight = 'Midnight',
}

export enum Season {
  Spring = 'Spring',
  Summer = 'Summer',
  Autumn = 'Autumn',
  Winter = 'Winter',
}

export enum ArtStyle {
  Photorealistic = 'Photorealistic',
  Cinematic = 'Cinematic',
  Anime = 'Anime',
  DigitalArt = 'Digital Art',
  OilPainting = 'Oil Painting',
  Cyberpunk = 'Cyberpunk',
  Minimalist = 'Minimalist',
  Vintage = 'Vintage',
}

export enum RotationMode {
  Camera = 'Camera',
  Object = 'Object'
}

export interface GenerationSettings {
  prompt: string;
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  cameraAngles: CameraAngle[];
  rotationMode: RotationMode;
  timeOfDay: TimeOfDay | null;
  season: Season | null;
  style: ArtStyle | null;
}

export interface GeneratedImage {
  url: string;
  timestamp: number;
}