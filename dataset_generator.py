import pandas as pd
import numpy as np
import argparse
import os

def sample_and_combine(file1, file2, sample_size1, sample_size2, output_file, random_seed=42):
    """
    Sample without replacement from two CSV files, mix the data, and save to a combined CSV.
    
    Args:
        file1 (str): Path to first CSV file
        file2 (str): Path to second CSV file
        sample_size1 (int): Number of samples to take from first file (use -1 for all rows)
        sample_size2 (int): Number of samples to take from second file (use -1 for all rows)
        output_file (str): Path to save the combined CSV
        random_seed (int): Random seed for reproducibility (default: 42)
    """
    # Set random seed for reproducibility
    np.random.seed(random_seed)
    
    # Read CSV files
    df1 = pd.read_csv(file1)
    df2 = pd.read_csv(file2)
    
    # Validate sample sizes
    if sample_size1 == -1:
        sample_size1 = len(df1)
    elif sample_size1 > len(df1):
        raise ValueError(f"Sample size {sample_size1} exceeds rows in {file1} ({len(df1)})")
    
    if sample_size2 == -1:
        sample_size2 = len(df2)
    elif sample_size2 > len(df2):
        raise ValueError(f"Sample size {sample_size2} exceeds rows in {file2} ({len(df2)})")
    
    # Sample without replacement using the fixed random seed
    sampled_df1 = df1.sample(n=sample_size1, replace=False, random_state=random_seed)
    sampled_df2 = df2.sample(n=sample_size2, replace=False, random_state=random_seed)
    
    # Combine and shuffle the samples
    combined = pd.concat([sampled_df1, sampled_df2], axis=0)
    combined = combined.sample(frac=1, random_state=random_seed).reset_index(drop=True)  # Shuffle rows
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Save to output file
    combined.to_csv(output_file, index=False)
    print(f"Successfully saved combined CSV to {output_file}")
    print(f"Total rows: {len(combined)} ({sample_size1} from {file1}, {sample_size2} from {file2})")
    print(f"Random seed used: {random_seed}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Sample and combine two CSV files with reproducible randomness')
    parser.add_argument('file1', help='First input CSV file')
    parser.add_argument('file2', help='Second input CSV file')
    parser.add_argument('--sample1', type=int, default=-1, help='Sample size for first file (-1 for all)')
    parser.add_argument('--sample2', type=int, default=-1, help='Sample size for second file (-1 for all)')
    parser.add_argument('--output', default='combined_output.csv', help='Output file name')
    parser.add_argument('--seed', type=int, default=42, help='Random seed for reproducibility (default: 42)')
    args = parser.parse_args()
    
    sample_and_combine(
        args.file1, 
        args.file2, 
        args.sample1, 
        args.sample2, 
        args.output,
        args.seed
    )