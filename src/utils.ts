export const flavors = ["sweet", "spicy", "sour", "bitter", "fresh"] as const;
export type Flavor = (typeof flavors)[number];
export type Combination = Readonly<{
  [berry: string]: number;
}>;
export type FlavorStats = {
  [flavor: string]: number;
}





export function setCookie(name: string, val: string, days: number) {
    const date = new Date();
    const value = val;

    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));

    document.cookie = name+"="+value+"; expires="+date.toUTCString()+"; path=/";
}

export function getCookie(name: string) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    
    if (parts.length == 2) {
        return parts.pop()?.split(";").shift();
    }
}