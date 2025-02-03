{
  description = "Activepieces";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };

        buildNodeJs = pkgs.callPackage "${nixpkgs}/pkgs/development/web/nodejs/nodejs.nix" {
          python = pkgs.python310;
        };

        nodejs = buildNodeJs {
          enableNpm = true;
          version = "20.18.2";
          sha256 = "sha256-ab+Btw86la4HY0WfAoYMKC1+OkdWfIr68SbMd4F2qII=";
        };

        nativeBuildInputs = with pkgs; [
          nodejs
        ];

        buildInputs = with pkgs; [];
      in {
        devShells.default = pkgs.mkShell {inherit nativeBuildInputs buildInputs;};
      }
    );
}
